# Contributing

Vad kul att du vill hjälpa till och utveckla nollk.it! Alla förbättringar leder
till en bättre upplevelse för både Nollan och NollKIT, så tack!

## Information om projektet

Projektet använder teknologierna i listan nedanför. Du behöver inte vara bekant
med alla för att göra ändringar men det gör det självklart lättare desto mer du
kan! Det skadar aldrig att försöka och du kan alltid fråga om hjälp.

- [Next.js](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Node.js](https://nodejs.org/)
- [Tailwind](https://tailwindcss.com/)
- [Prisma](https://www.prisma.io/)
- [Docker](https://www.docker.com/) ([Docker Compose](https://docs.docker.com/compose/))
- [MongoDB](https://www.mongodb.com/)

## För att utveckla

Installera [Docker Compose](https://docs.docker.com/compose/install) och
[Node.js](https://nodejs.org/en/download) om du inte redan har det.

### Starta databasen

```console
docker compose --file dev/docker-compose.yml up -d
```

> [!WARNING]
> Om du får ett felmeddelande, [kontrollera att Docker körs](https://docs.docker.com/engine/daemon/troubleshoot/).

### Förbered webbsidan

1. Skapa filen `.env` med följande innehåll:

    ```env
    DATABASE_URL=mongodb://localhost:27017/db
    PASSWORD=123
    ```

2. Kör dessa kommandon:

    ```console
    npm install -D
    npx prisma generate
    ```

### Starta webbsidan

```console
npm run dev
```

> [!TIP]
> Sidan uppdateras automatiskt när du ändrar källkoden.

### Stäng av databasen

```compose
docker compose --file dev/docker-compose.yml down
```
