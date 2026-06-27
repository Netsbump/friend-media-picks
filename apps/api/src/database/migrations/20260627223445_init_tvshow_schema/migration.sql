CREATE TABLE "genres" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL UNIQUE,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "persons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tv_show_directors" (
	"tv_show_id" uuid,
	"person_id" uuid,
	CONSTRAINT "tv_show_directors_pkey" PRIMARY KEY("tv_show_id","person_id")
);
--> statement-breakpoint
CREATE TABLE "tv_show_genres" (
	"tv_show_id" uuid,
	"genre_id" uuid,
	CONSTRAINT "tv_show_genres_pkey" PRIMARY KEY("tv_show_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "tv_show_stars" (
	"tv_show_id" uuid,
	"person_id" uuid,
	CONSTRAINT "tv_show_stars_pkey" PRIMARY KEY("tv_show_id","person_id")
);
--> statement-breakpoint
CREATE TABLE "tv_show_writers" (
	"tv_show_id" uuid,
	"person_id" uuid,
	CONSTRAINT "tv_show_writers_pkey" PRIMARY KEY("tv_show_id","person_id")
);
--> statement-breakpoint
CREATE TABLE "tv_shows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"description" text NOT NULL,
	"seasons" integer NOT NULL,
	"episodes" integer NOT NULL,
	"release_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tv_show_directors" ADD CONSTRAINT "tv_show_directors_tv_show_id_tv_shows_id_fkey" FOREIGN KEY ("tv_show_id") REFERENCES "tv_shows"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "tv_show_directors" ADD CONSTRAINT "tv_show_directors_person_id_persons_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "tv_show_genres" ADD CONSTRAINT "tv_show_genres_tv_show_id_tv_shows_id_fkey" FOREIGN KEY ("tv_show_id") REFERENCES "tv_shows"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "tv_show_genres" ADD CONSTRAINT "tv_show_genres_genre_id_genres_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "tv_show_stars" ADD CONSTRAINT "tv_show_stars_tv_show_id_tv_shows_id_fkey" FOREIGN KEY ("tv_show_id") REFERENCES "tv_shows"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "tv_show_stars" ADD CONSTRAINT "tv_show_stars_person_id_persons_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "tv_show_writers" ADD CONSTRAINT "tv_show_writers_tv_show_id_tv_shows_id_fkey" FOREIGN KEY ("tv_show_id") REFERENCES "tv_shows"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "tv_show_writers" ADD CONSTRAINT "tv_show_writers_person_id_persons_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE CASCADE;