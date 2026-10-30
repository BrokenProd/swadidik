export type Course = {
  courseId: string;
  title: string;
  description: string;
  authorName: string;
  createdAt: Date;
  expireAt: Date | null;
};

export type Track = {
  uuid: string;
  order: number;
  title: string;
  material: string;
};

export type CourseProgress = {
  track_id: string;
  is_done: boolean;
};
