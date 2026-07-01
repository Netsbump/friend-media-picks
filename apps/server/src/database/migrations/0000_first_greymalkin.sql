CREATE TABLE "genres" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "genres_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "persons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "persons_first_name_last_name_unique" UNIQUE("first_name","last_name")
);
--> statement-breakpoint
CREATE TABLE "tv_show_directors" (
	"tv_show_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	CONSTRAINT "tv_show_directors_tv_show_id_person_id_pk" PRIMARY KEY("tv_show_id","person_id")
);
--> statement-breakpoint
CREATE TABLE "tv_show_genres" (
	"tv_show_id" uuid NOT NULL,
	"genre_id" uuid NOT NULL,
	CONSTRAINT "tv_show_genres_tv_show_id_genre_id_pk" PRIMARY KEY("tv_show_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "tv_show_stars" (
	"tv_show_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	CONSTRAINT "tv_show_stars_tv_show_id_person_id_pk" PRIMARY KEY("tv_show_id","person_id")
);
--> statement-breakpoint
CREATE TABLE "tv_show_writers" (
	"tv_show_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	CONSTRAINT "tv_show_writers_tv_show_id_person_id_pk" PRIMARY KEY("tv_show_id","person_id")
);
--> statement-breakpoint
CREATE TABLE "tv_shows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"seasons" integer NOT NULL,
	"episodes" integer NOT NULL,
	"release_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tv_show_directors" ADD CONSTRAINT "tv_show_directors_tv_show_id_tv_shows_id_fk" FOREIGN KEY ("tv_show_id") REFERENCES "public"."tv_shows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tv_show_directors" ADD CONSTRAINT "tv_show_directors_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tv_show_genres" ADD CONSTRAINT "tv_show_genres_tv_show_id_tv_shows_id_fk" FOREIGN KEY ("tv_show_id") REFERENCES "public"."tv_shows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tv_show_genres" ADD CONSTRAINT "tv_show_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tv_show_stars" ADD CONSTRAINT "tv_show_stars_tv_show_id_tv_shows_id_fk" FOREIGN KEY ("tv_show_id") REFERENCES "public"."tv_shows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tv_show_stars" ADD CONSTRAINT "tv_show_stars_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tv_show_writers" ADD CONSTRAINT "tv_show_writers_tv_show_id_tv_shows_id_fk" FOREIGN KEY ("tv_show_id") REFERENCES "public"."tv_shows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tv_show_writers" ADD CONSTRAINT "tv_show_writers_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;