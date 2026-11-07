# backend

# Requirements

This application uses latest features of both node (modules imports, etc) and postgresql (covering indecies), so you need to ensure that major versions are up to date.

* node 12
* postgresql 12

# Configuration

Postgres settings are passed as environment variables (https://www.postgresql.org/docs/9.3/libpq-envars.html), at the very least you'd like to provide PGDATABASE variable in the `.env` file. 

Additionally `.env` file must have all variables set that are present in `.env.example`. You can find `.env` configuration in a pinned message of #medes-tech slack channel.

# Installation
```
    npm install -g pm2
    npm run start:development 
```

# Starting the app



