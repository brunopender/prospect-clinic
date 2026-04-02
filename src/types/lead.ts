export type LeadStatus =
  | "novo"
  | "contatado"
  | "respondeu"
  | "fechado"
  | "descartado";

export type Platform = "instagram" | "linkedin";

export interface Lead {
  id: string;
  name: string;
  profileUrl: string;
  platform: Platform;
  bio: string;
  followersCount: number;
  status: LeadStatus;
  message: string | null;
  createdAt: string;
}

export interface LeadsStore {
  leads: Lead[];
  updatedAt: string;
}
