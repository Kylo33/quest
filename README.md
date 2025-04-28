# Questing Calculator

## Redis

To set up redis (for caching) using Docker, run the following command:

```bash
docker run -d --name redis -p 6379:6379 redis
```

To execute commands using the `redis-cli`, use this command, which will
put you in an interactive cli environment.

```bash
docker exec -it redis redis-cli
```
