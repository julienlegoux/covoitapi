export type WithAuthContext<T> = T & {
	userId: string;
};
