# How to Make Database Schema Changes

This project uses **Prisma** with **Neon PostgreSQL**. Follow these steps to make database schema changes.

## Quick Workflow

### 1. Update the Prisma Schema
Edit `prisma/schema.prisma` with your changes.

**Example - Adding a new field:**
```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  name          String
  password      String
  avatarUrl     String?   @map("avatar_url")
  phoneNumber   String?   // NEW FIELD
  createdAt     DateTime  @default(now()) @map("created_at")

  // ... rest of the model
}
```

### 2. Create a Migration
Run this command from the `groupsync` directory:

```bash
cd groupsync
npx prisma migrate dev --name describe_your_change
```

**Examples:**
```bash
npx prisma migrate dev --name add_phone_number
npx prisma migrate dev --name add_user_avatar
npx prisma migrate dev --name add_meeting_status
```

This will:
- Create a migration file in `prisma/migrations/`
- Apply the migration to your local database
- Regenerate the Prisma Client

### 3. Test Locally
Make sure your changes work by:
- Running your app locally: `npm run dev`
- Testing the affected features
- Checking for any TypeScript errors

### 4. Commit and Push to GitHub

```bash
git add .
git commit -m "Add database migration: describe your change"
git push origin main
```

### 5. Vercel Auto-Deploys
The postinstall script automatically runs `prisma db push` during deployment, so your production database will be updated automatically.

---

## Important Notes

### ⚠️ Never Do This
- ❌ Don't edit migration files manually
- ❌ Don't skip creating migrations
- ❌ Don't commit `.env` or `.env.local` files

### ✅ Always Do This
- ✅ Create migrations for schema changes
- ✅ Test locally first
- ✅ Commit migration files to git
- ✅ Use descriptive migration names

### 🔍 Useful Commands

**View migration history:**
```bash
npx prisma migrate status
```

**Reset local database (careful!):**
```bash
npx prisma migrate reset
```

**Generate Prisma Client (if needed):**
```bash
npx prisma generate
```

**View database in Prisma Studio:**
```bash
npx prisma studio
```

---

## Common Changes

### Add a New Field
```prisma
// Before
model Project {
  id           String    @id @default(uuid())
  name         String
  description  String?
}

// After - add a new field
model Project {
  id           String    @id @default(uuid())
  name         String
  description  String?
  status       String    @default("active")  // NEW
}
```

Then run:
```bash
npx prisma migrate dev --name add_project_status
```

### Add a New Model
```prisma
// Add this new model
model Tag {
  id        String   @id @default(uuid())
  name      String   @unique
  createdAt DateTime @default(now()) @map("created_at")

  @@map("tags")
}
```

Then run:
```bash
npx prisma migrate dev --name create_tag_model
```

### Make a Field Required (careful with existing data!)
```prisma
// Before
model User {
  email String?  // Optional
}

// After
model User {
  email String   // Required
}
```

You may need to use `@default()` or set `--accept-data-loss` during migration.

---

## Troubleshooting

**Error: "Prisma migrations are out of sync"**
- Run: `npx prisma migrate resolve --rolled-back <migration_name>`

**Error: "Migration can't be applied"**
- Review the generated migration file in `prisma/migrations/`
- You may need to use `--accept-data-loss` flag for breaking changes

**Local database is broken**
- Run: `npx prisma migrate reset` (WARNING: deletes all data)
- Re-seed your database if needed

---

## Need Help?

- [Prisma Docs](https://www.prisma.io/docs)
- [Database: Neon](https://neon.tech/docs)
- Check git history: `git log --oneline` to see previous migrations
