FROM alpine:3.20
RUN apk add --no-cache curl bash
COPY load.sh /load.sh
RUN chmod +x /load.sh
ENTRYPOINT ["/load.sh"]
