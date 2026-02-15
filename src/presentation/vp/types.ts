export type VpAddress = {
	street_number: string;
	street_name: string;
	postal_code: string;
	city_name: string;
};

export type VpPersonResponse = {
	id: string;
	firstname: string | null;
	lastname: string | null;
	phone: string | null;
	email: string;
	created_at: string;
	updated_at: string;
};

export type VpCarResponse = {
	id: string;
	carregistration: string;
	model_ref_id: number;
	driver_ref_id: number;
};
