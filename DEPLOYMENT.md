# Deployment Guide

This guide covers the CI/CD pipeline and deployment options for the Music Assistant AI Playlist Creator.

## Table of Contents

- [CI/CD Pipeline](#cicd-pipeline)
- [Production Deployment (from Docker Hub)](#production-deployment-from-docker-hub)
- [Local Development](#local-development)
- [Version Management](#version-management)

---

## CI/CD Pipeline

### Overview

The project uses GitHub Actions to automatically build and push Docker images to Docker Hub. Images are built for both `linux/amd64` and `linux/arm64` platforms.

### Triggers

The pipeline runs automatically on:
- **Push to `main` branch**: Builds and tags as `latest`
- **Version tags** (e.g., `v1.2.3`): Builds and tags with semantic version
- **Manual trigger**: Via GitHub Actions workflow dispatch

### Setup GitHub Secrets

To enable the CI/CD pipeline, configure these secrets in your GitHub repository:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add the following repository secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `DOCKER_USERNAME` | Your Docker Hub username | `jonsilver` |
| `DOCKER_PASSWORD` | Your Docker Hub access token | `dckr_pat_...` |

**To create a Docker Hub access token:**
1. Log in to [Docker Hub](https://hub.docker.com/)
2. Go to **Account Settings** → **Security** → **Access Tokens**
3. Click **New Access Token**
4. Give it a description (e.g., "GitHub Actions") and read/write permissions
5. Copy the token and save it as the `DOCKER_PASSWORD` secret

### Image Tagging Strategy

The pipeline automatically creates the following tags:

| Condition | Tags Created | Example |
|-----------|--------------|---------|
| Push to `main` | `latest`, `main-<sha>` | `latest`, `main-a1b2c3d` |
| Version tag | `<version>`, `<major>.<minor>`, `<major>` | `1.2.3`, `1.2`, `1` |

### Customizing the Docker Image Name

By default, images are pushed to `$DOCKER_USERNAME/music-assistant-ai-playlist-creator`. To change this:

1. Edit `.github/workflows/docker-publish.yml`
2. Update the `DOCKER_IMAGE` environment variable
3. Update `docker-compose.yml` to match your image name

---

## Production Deployment (from Docker Hub)

### Prerequisites

- Docker and Docker Compose installed on your server
- Network access to Docker Hub

### Quick Start

1. **Create deployment directory:**
   ```bash
   mkdir music-assistant-playlist
   cd music-assistant-playlist
   ```

2. **Download deployment files:**
   ```bash
   # Download docker-compose.yml
   curl -O https://raw.githubusercontent.com/JonSilver/music-assistant-ai-playlist-creator/main/docker-compose.yml

   # Download environment template
   curl -O https://raw.githubusercontent.com/JonSilver/music-assistant-ai-playlist-creator/main/.env.production.example
   mv .env.production.example .env
   ```

3. **Configure environment:**
   ```bash
   # Edit .env file
   nano .env
   ```

   Example `.env`:
   ```env
   # Docker Image (change if using custom registry)
   DOCKER_IMAGE=jonsilver/music-assistant-ai-playlist-creator
   IMAGE_TAG=latest

   # Application port
   APP_PORT=9876

   # Data persistence path
   DATA_PATH=./data
   ```

4. **Create data directory:**
   ```bash
   mkdir -p data
   ```

5. **Start the application:**
   ```bash
   docker-compose pull  # Pull latest image
   docker-compose up -d  # Start in detached mode
   ```

6. **Verify deployment:**
   ```bash
   docker-compose logs -f
   ```

   Access the application at `http://your-server:9876`

### Managing the Deployment

```bash
# View logs
docker-compose logs -f

# Stop the application
docker-compose down

# Update to latest version
docker-compose pull
docker-compose up -d

# Restart the application
docker-compose restart

# Check status
docker-compose ps
```

### Using Specific Versions

To deploy a specific version instead of `latest`:

```env
# In .env file
IMAGE_TAG=1.2.3  # Use specific version
```

Then pull and restart:
```bash
docker-compose pull
docker-compose up -d
```

### Data Persistence

The application stores its SQLite database in the mounted volume at `/app/data`. Ensure this directory:
- Has proper permissions
- Is backed up regularly
- Persists across container restarts

**Backup your data:**
```bash
# Stop the application
docker-compose down

# Backup data directory
tar -czf backup-$(date +%Y%m%d).tar.gz data/

# Restart
docker-compose up -d
```

---

## Local Development

For local development with live builds, use the development compose file:

### Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development environment:**
   ```bash
   # Option 1: Build and run with Docker
   docker-compose -f docker-compose.dev.yml up --build

   # Option 2: Run directly (hot reload)
   npm run dev
   ```

The development compose file (`docker-compose.dev.yml`) builds the Docker image locally instead of pulling from Docker Hub.

### Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| Compose file | `docker-compose.dev.yml` | `docker-compose.yml` |
| Image source | Local build | Docker Hub |
| Build command | `docker-compose up --build` | `docker-compose pull` |
| Hot reload | Via `npm run dev` | Not available |

---

## Version Management

### Creating a Release

1. **Update version in package.json:**
   ```bash
   # This happens automatically with build:prod
   npm run build:prod
   ```

2. **Commit changes:**
   ```bash
   git add .
   git commit -m "chore: version bump to X.Y.Z"
   ```

3. **Create and push version tag:**
   ```bash
   git tag v1.2.3
   git push origin main
   git push origin v1.2.3
   ```

4. **GitHub Actions automatically:**
   - Builds the Docker image
   - Tags it with `1.2.3`, `1.2`, `1`, and `latest`
   - Pushes to Docker Hub

### Versioning Strategy

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0): Breaking changes
- **MINOR** (0.X.0): New features, backwards compatible
- **PATCH** (0.0.X): Bug fixes, backwards compatible

---

## Troubleshooting

### Pipeline Issues

**Problem: GitHub Actions workflow fails with authentication error**
- Solution: Verify `DOCKER_USERNAME` and `DOCKER_PASSWORD` secrets are set correctly
- Check that Docker Hub access token has read/write permissions

**Problem: Build fails during pipeline**
- Solution: Check the workflow logs in GitHub Actions
- Ensure the Dockerfile builds locally: `docker build -t test .`

### Deployment Issues

**Problem: Cannot pull image from Docker Hub**
- Solution: Check image name and tag in `.env` file
- Verify network connectivity to Docker Hub
- Try: `docker pull jonsilver/music-assistant-ai-playlist-creator:latest`

**Problem: Container starts but crashes immediately**
- Solution: Check logs with `docker-compose logs`
- Verify `/app/data` volume is mounted correctly
- Ensure data directory has proper permissions

**Problem: Database errors**
- Solution: Check that `DATA_PATH` points to a persistent directory
- Verify the directory is writable
- Review entrypoint script validation in logs

### Getting Help

For issues or questions:
1. Check the [GitHub Issues](https://github.com/JonSilver/music-assistant-ai-playlist-creator/issues)
2. Review container logs: `docker-compose logs -f`
3. Validate your configuration against `.env.production.example`
