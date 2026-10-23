type Course = {
    courseId: string;
    title: string;
    description: string;
    authorName: string
    createdAt: Date;
    expireAt: Date | null
};

export type { Course }