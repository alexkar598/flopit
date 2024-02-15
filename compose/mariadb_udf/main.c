#include <assert.h>
#include <stdio.h>
#include <stdint.h>
#include <endian.h>
#include <pthread.h>
#include <time.h>
#include <stdbool.h>
#include <string.h>
#include <openssl/rand.h>
#include <mysql/mysql.h>

_Atomic uint8_t counter;

char* create_uuid7(UDF_INIT *initid, UDF_ARGS *args,
          char *result, unsigned long *length,
          char *is_null, char *error) {
  struct timespec ts;
  timespec_get(&ts, TIME_UTC);
  uint8_t u[16] = {0};

  const __time_t millis = ts.tv_sec * 1000 + ts.tv_nsec / 1000000;

  *((uint64_t*)u) |= htobe64(
    (millis << (sizeof(millis) * CHAR_BIT - 48)) |
    (ts.tv_nsec % 1000000 >> 8)
  );

  RAND_bytes(&u[8], 8);
  ((uint32_t*)u)[2] = htobe32(0x80000000 | (counter++ << 22) | ((uint32_t*)u)[2] >> 10);

  u[6] = 0x70 | (u[6] & 0x0F);

  static const char hex[16] = {'0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'};

  int s = 0;
  for(int i = 0; i < 16; i++)
  {
    if(i == 4 || i == 6 || i == 8 || i == 10)
      result[s++] = '-';
    result[s++] = hex[u[i] >> 4];
    result[s++] = hex[u[i] & 0x0f];
  }
  *length = 36;
  *is_null = false;
  return result;
}
bool create_uuid7_init(UDF_INIT *initid, UDF_ARGS *args, char *message) {
  return false;
}
void create_uuid7_deinit(UDF_INIT *initid) {
}
