# Project Scaffolding Template

This is a scaffolding project template with automated CI/CD deployment.

## GitHub Workflow Setup

This project includes a GitHub Actions workflow that automatically builds, pushes to GitHub Container Registry, and deploys to a server.

### Workflow Features

- **Triggers:** Runs on push to `main` branch
- **Build & Push:** Builds Docker image and pushes to GitHub Container Registry (`ghcr.io`)
- **Deploy:** Automatically deploys to your server via SSH
- **Tags:** Creates `latest`, branch name, and SHA-based tags

### Required Setup

#### 1. GitHub Secrets

Add these secrets in your repository settings (Settings → Secrets and variables → Actions):

- `SERVER_HOST` - Your server IP address or hostname
- `SERVER_USER` - SSH username for server access
- `SERVER_SSH_KEY` - SSH private key for authentication

#### 2. Dockerfile

Ensure your project has a `Dockerfile` in the root directory.

#### 3. Server Requirements

Your deployment server needs:
- Docker installed
- SSH access configured
- Firewall rules allowing your application ports

### Customization

When cloning this template for a new project:

1. Update the container name in `.github/workflows/deploy.yml` (currently `tslib`)
2. Modify the `docker run` command with your application's specific requirements (ports, volumes, environment variables)
3. Add your project-specific configuration and secrets
4. Update this README with project-specific information

### Manual Deployment

To manually pull and run the latest image:

```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin
docker pull ghcr.io/YOUR_USERNAME/YOUR_REPO:latest
docker stop your-container-name || true
docker rm your-container-name || true
docker run -d --name your-container-name --restart unless-stopped ghcr.io/YOUR_USERNAME/YOUR_REPO:latest
```
