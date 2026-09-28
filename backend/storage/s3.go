package storage

import (
	"context"
	"errors"
	"io"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/smithy-go"
)

var ErrNotFound = errors.New("s3 object not found")

type S3Client struct {
	client    *s3.Client
	presigner *s3.PresignClient
}

type Object struct {
	Key          string
	Size         int64
	ETag         string
	LastModified time.Time
	ContentType  string
}

type ListOptions struct {
	Prefix    string
	Delimiter string
	MaxKeys   int32
}

type ListResult struct {
	Objects        []Object
	CommonPrefixes []string
	NextToken      string
}

type GetResult struct {
	Body          io.ReadCloser
	ContentLength int64
	ContentType   string
	ETag          string
	LastModified  time.Time
}

func NewDefault() *S3Client {
	ctx := context.Background()

	sdkConfig, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		panic(err)
	}

	client := s3.NewFromConfig(sdkConfig, func(o *s3.Options) {
		o.BaseEndpoint = aws.String("https://t3.storage.dev")
		o.Region = "auto"
		o.UsePathStyle = false
	})

	return &S3Client{
		client:    client,
		presigner: s3.NewPresignClient(client),
	}
}

// GetObject downloads an object from S3.
func (c *S3Client) GetObject(
	ctx context.Context,
	bucket string,
	key string,
) (*GetResult, error) {
	result, err := c.client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, err
	}

	return &GetResult{
		Body:          result.Body,
		ContentLength: aws.ToInt64(result.ContentLength),
		ContentType:   aws.ToString(result.ContentType),
		ETag:          aws.ToString(result.ETag),
		LastModified:  aws.ToTime(result.LastModified),
	}, nil
}

// PutObject uploads an object to S3.
func (c *S3Client) PutObject(
	ctx context.Context,
	bucket string,
	key string,
	body io.Reader,
	contentType string,
) error {
	input := &s3.PutObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
		Body:   body,
	}

	if contentType != "" {
		input.ContentType = aws.String(contentType)
	}

	_, err := c.client.PutObject(ctx, input)

	return err
}

// DeleteObject deletes an object from S3.
func (c *S3Client) DeleteObject(
	ctx context.Context,
	bucket string,
	key string,
) error {
	_, err := c.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})

	return err
}

// HeadObject retrieves object metadata without downloading the object.
func (c *S3Client) HeadObject(
	ctx context.Context,
	bucket string,
	key string,
) (*Object, error) {
	result, err := c.client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, err
	}

	return &Object{
		Key:          key,
		Size:         aws.ToInt64(result.ContentLength),
		ETag:         aws.ToString(result.ETag),
		LastModified: aws.ToTime(result.LastModified),
		ContentType:  aws.ToString(result.ContentType),
	}, nil
}

// Exists checks whether an object exists.
//
// Returns:
//   - true, nil  -> object exists
//   - false, nil -> object does not exist
//   - false, err -> an error occurred, such as insufficient permissions
func (c *S3Client) Exists(
	ctx context.Context,
	bucket string,
	key string,
) (bool, error) {
	_, err := c.client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})

	if err == nil {
		return true, nil
	}

	var apiErr smithy.APIError

	if errors.As(err, &apiErr) {
		switch apiErr.ErrorCode() {
		case "NotFound", "NoSuchKey":
			return false, nil
		}
	}

	return false, err
}

// ListObjects lists one page of objects.
func (c *S3Client) ListObjects(
	ctx context.Context,
	bucket string,
	options ListOptions,
) (*ListResult, error) {
	input := &s3.ListObjectsV2Input{
		Bucket: aws.String(bucket),
	}

	if options.Prefix != "" {
		input.Prefix = aws.String(options.Prefix)
	}

	if options.Delimiter != "" {
		input.Delimiter = aws.String(options.Delimiter)
	}

	if options.MaxKeys > 0 {
		input.MaxKeys = aws.Int32(options.MaxKeys)
	}

	result, err := c.client.ListObjectsV2(ctx, input)
	if err != nil {
		return nil, err
	}

	objects := make([]Object, 0, len(result.Contents))

	for _, item := range result.Contents {
		objects = append(objects, Object{
			Key:          aws.ToString(item.Key),
			Size:         aws.ToInt64(item.Size),
			ETag:         aws.ToString(item.ETag),
			LastModified: aws.ToTime(item.LastModified),
		})
	}

	prefixes := make([]string, 0, len(result.CommonPrefixes))

	for _, prefix := range result.CommonPrefixes {
		prefixes = append(prefixes, aws.ToString(prefix.Prefix))
	}

	return &ListResult{
		Objects:        objects,
		CommonPrefixes: prefixes,
		NextToken:      aws.ToString(result.NextContinuationToken),
	}, nil
}

// ListAllObjects lists all objects matching the specified prefix.
func (c *S3Client) ListAllObjects(
	ctx context.Context,
	bucket string,
	prefix string,
) ([]Object, error) {
	paginator := s3.NewListObjectsV2Paginator(
		c.client,
		&s3.ListObjectsV2Input{
			Bucket: aws.String(bucket),
			Prefix: aws.String(prefix),
		},
	)

	objects := make([]Object, 0)

	for paginator.HasMorePages() {
		result, err := paginator.NextPage(ctx)
		if err != nil {
			return nil, err
		}

		for _, item := range result.Contents {
			objects = append(objects, Object{
				Key:          aws.ToString(item.Key),
				Size:         aws.ToInt64(item.Size),
				ETag:         aws.ToString(item.ETag),
				LastModified: aws.ToTime(item.LastModified),
			})
		}
	}

	return objects, nil
}

// PresignGetObject generates a temporary URL for downloading an object.
func (c *S3Client) PresignGetObject(
	ctx context.Context,
	bucket string,
	key string,
	expiration time.Duration,
) (string, error) {
	result, err := c.presigner.PresignGetObject(
		ctx,
		&s3.GetObjectInput{
			Bucket: aws.String(bucket),
			Key:    aws.String(key),
		},
		s3.WithPresignExpires(expiration),
	)
	if err != nil {
		return "", err
	}

	return result.URL, nil
}

// PresignPutObject generates a temporary URL for uploading an object.
func (c *S3Client) PresignPutObject(
	ctx context.Context,
	bucket string,
	key string,
	expiration time.Duration,
	contentType string,
) (string, error) {
	input := &s3.PutObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	}

	if contentType != "" {
		input.ContentType = aws.String(contentType)
	}

	result, err := c.presigner.PresignPutObject(
		ctx,
		input,
		s3.WithPresignExpires(expiration),
	)
	if err != nil {
		return "", err
	}

	return result.URL, nil
}

// CopyObject copies an object within S3.
func (c *S3Client) CopyObject(
	ctx context.Context,
	bucket string,
	sourceKey string,
	destinationKey string,
) error {
	_, err := c.client.CopyObject(ctx, &s3.CopyObjectInput{
		Bucket:     aws.String(bucket),
		Key:        aws.String(destinationKey),
		CopySource: aws.String(bucket + "/" + sourceKey),
	})

	return err
}

// MoveObject copies an object and then deletes the source.
func (c *S3Client) MoveObject(
	ctx context.Context,
	bucket string,
	sourceKey string,
	destinationKey string,
) error {
	if err := c.CopyObject(
		ctx,
		bucket,
		sourceKey,
		destinationKey,
	); err != nil {
		return err
	}

	return c.DeleteObject(ctx, bucket, sourceKey)
}
