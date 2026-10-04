export type Role = "USER" | "ADMIN";

export type EventType =
  | "WEDDING"
  | "BIRTHDAY"
  | "MORNING_OSH"
  | "SUNNAT"
  | "ENGAGEMENT"
  | "CORPORATE"
  | "GRADUATION"
  | "FAMILY_EVENT"
  | "OTHER";

export type InvitationStatus = "DRAFT" | "WAITING_PAYMENT" | "PAYMENT_REVIEW" | "PUBLISHED" | "REJECTED" | "ARCHIVED";

export type AuthUser = {
  id: number;
  telegramId?: string | null;
  firstName: string;
  lastName?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  role: Role;
};

export type AuthSession = {
  accessToken: string;
  accessTokenExpiresIn?: number;
  user: AuthUser;
};

export type TelegramLoginPayload = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

export type TemplateOption = {
  id: number;
  code: string;
  name: string;
  eventType: EventType | null;
  previewUrl: string;
  thumbnailUrl?: string | null;
  priceAmount: number;
  currency: string;
};

export type InvitationSummary = {
  id: number;
  slug: string;
  eventType: EventType;
  title: string | null;
  status: InvitationStatus;
  startsAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  template: {
    id: number;
    code: string;
    name: string;
  };
  _count?: {
    media: number;
  };
};

export type InvitationListResponse = {
  items: InvitationSummary[];
  nextCursor: number | null;
};

export type CreatedInvitation = {
  id: number;
  status: InvitationStatus;
};

export type Participant = {
  role: string;
  name: string;
};

export type UpdateInvitationPayload = {
  title?: string;
  participants?: Participant[];
  organizer?: string;
  startsAt?: string;
  endsAt?: string;
  timezone?: string;
  venueName?: string;
  venueAddress?: string;
  mapProvider?: "YANDEX" | "GOOGLE" | "OTHER";
  mapUrl?: string;
  contacts?: {
    telegram?: string;
    instagram?: string;
    phone?: string;
    whatsapp?: string;
  };
  extra?: Record<string, unknown>;
  templateId?: number;
};

export type InvitationDetail = InvitationSummary & {
  participants: Participant[];
  organizer: string | null;
  endsAt: string | null;
  timezone: string;
  venue: {
    name: string | null;
    address: string | null;
    mapProvider: "YANDEX" | "GOOGLE" | "OTHER" | null;
    mapUrl: string | null;
    latitude: string | null;
    longitude: string | null;
  };
  contacts: UpdateInvitationPayload["contacts"] | null;
  extra: Record<string, unknown> | null;
};
