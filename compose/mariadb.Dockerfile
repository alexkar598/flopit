FROM ubuntu:jammy-20240125 as build

WORKDIR /build/mariadb_udf/

RUN --mount=target=/var/lib/apt/lists,type=cache,sharing=locked \
    --mount=target=/var/cache/apt,type=cache,sharing=locked \
    rm -f /etc/apt/apt.conf.d/docker-clean \
    && apt-get update \
    && apt-get -y --no-install-recommends install \
    cmake make gcc libssl-dev libmysqlclient-dev

COPY mariadb_udf .

RUN mkdir cmake && cd cmake && cmake -DCMAKE_BUILD_TYPE=Release .. && cmake --build .

FROM mariadb:11.2.2

COPY --from=build /build/mariadb_udf/cmake/libflopit_udf.so /usr/lib/mysql/plugin/flopit_udf.so