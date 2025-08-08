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

Installera [Docker Compose](https://docs.docker.com/compose/install) om du inte redan har det.

### Starta webbsidan

```console
docker compose --file dev-docker-compose.yml up -d
```

> [!TIP]
> Om du kör Linux uppdateras sidan automatiskt när du ändrar källkoden.

### Titta på loggarna

```console
docker logs --follow nollkit-nextjs-1
```

### Stäng av webbsidan

```compose
docker compose --file dev-docker-compose.yml down
```
