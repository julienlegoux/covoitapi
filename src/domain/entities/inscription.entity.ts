export type InscriptionEntity = {
	id: string;
	refId: number;
	createdAt: Date;
	userRefId: number;
	routeRefId: number;
	status: string;
};

export type CreateInscriptionData = Pick<InscriptionEntity, 'userRefId' | 'routeRefId'>;
