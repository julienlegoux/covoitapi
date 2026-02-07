export type InscriptionEntity = {
	id: string;
	createdAt: Date;
	userId: string;
	routeId: string;
};

export type CreateInscriptionData = Pick<InscriptionEntity, 'userId' | 'routeId'>;
