FROM nginx:1.27-alpine
ARG GIT_SHA=dev
COPY app/index.html /usr/share/nginx/html/index.html
# Lets you confirm exactly which commit is live
RUN echo "${GIT_SHA}" > /usr/share/nginx/html/version.txt
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1