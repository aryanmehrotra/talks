# Serves the Open Source India 2026 deck as a static site.
# The slides are one self-contained HTML file plus brand assets, so there is no build stage.
FROM nginxinc/nginx-unprivileged:alpine

COPY open-source-india-2026-services-an-ai-can-write-and-a-team-can-run/slides/ /usr/share/nginx/html/

EXPOSE 8080
