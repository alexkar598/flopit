cmake_minimum_required(VERSION 3.22)
project(flopit_udf C)

set(CMAKE_C_STANDARD 17)

add_definitions(-D_TIME_BITS=64 -D_FILE_OFFSET_BITS=64)

add_library(flopit_udf SHARED main.c)
