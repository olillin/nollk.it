# nollk.it
Webbsida för NollKIT.

Utvecklad av Jacob Bengtsson och Dadi Andrason 2022/2023.<br>Lanserades för mottagningen 2023.

## Hur gör man?
Moduler och fonter laddas upp direkt till repot. Moduler görs det för att detta fungerar som ett lager. 
Fonter läggs här på grund av tekniska begränsningar.

Döp filerna till `år.pdf` eller `år.ttf`.


För att starta projektet bygg docker nånting nånting
Prisma generate? Gör det lätt att förstå helt enkelt.



## För att utveckla

Installera [Docker Compose](https://docs.docker.com/compose/install) och
[Node.js®](https://nodejs.org/en/download) om du inte redan har det.

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
