# -------- builder
FROM golang:1.22-bookworm AS builder
WORKDIR /src
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /out/server ./main.go

# -------- runtime (Ubuntu)
FROM ubuntu:24.04
ENV TZ=America/Sao_Paulo
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && \
    rm -rf /var/lib/apt/lists/*
COPY --from=builder /out/server /usr/local/bin/server
EXPOSE 8080
USER nobody
CMD ["/usr/local/bin/server"]
