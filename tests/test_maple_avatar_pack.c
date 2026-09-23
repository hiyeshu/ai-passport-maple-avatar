/**
 * [INPUT]: Depends on the public pure-C avatar-pack parser and the generated sample pack.
 * [OUTPUT]: Verifies JavaScript/C schema compatibility and fail-closed corruption handling.
 * [POS]: Host integration test for the importer-to-firmware binary Seam.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#include <assert.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

#include "maple_avatar_pack_format.h"

static uint8_t *read_fixture(size_t *size)
{
    FILE *file = fopen("main/maple_avatar/generated/avatar.pack", "rb");
    assert(file);
    assert(fseek(file, 0, SEEK_END) == 0);
    long length = ftell(file);
    assert(length > 0);
    assert(fseek(file, 0, SEEK_SET) == 0);
    uint8_t *bytes = malloc((size_t)length);
    assert(bytes);
    assert(fread(bytes, 1, (size_t)length, file) == (size_t)length);
    fclose(file);
    *size = (size_t)length;
    return bytes;
}

int main(void)
{
    size_t size = 0;
    uint8_t *bytes = read_fixture(&size);
    maple_avatar_pack_view_t pack;
    uint32_t declared_size = 0;

    assert(maple_avatar_pack_peek_total_size(bytes, size, &declared_size) == MAPLE_AVATAR_PACK_OK);
    assert(declared_size == size);
    assert(maple_avatar_pack_parse(bytes, size, &pack) == MAPLE_AVATAR_PACK_OK);
    assert(pack.build_id == 5293);
    assert(pack.flags & MAPLE_AVATAR_PACK_FLAG_SAMPLE);
    assert(pack.total_size == size);
    assert(pack.screen != NULL);
    assert(pack.builder_screen != NULL);
    assert(pack.actions[MAPLE_AVATAR_PACK_ACTION_STAND].frame_count == 3);
    assert(pack.actions[MAPLE_AVATAR_PACK_ACTION_WALK].frame_count == 4);
    assert(pack.actions[MAPLE_AVATAR_PACK_ACTION_SIT].frame_count == 1);
    assert(pack.actions[MAPLE_AVATAR_PACK_ACTION_SIT].frame_delay_ms == 0);
    assert(pack.actions[MAPLE_AVATAR_PACK_ACTION_TWO_HAND_WALK].frames[3] != NULL);

    bytes[size - 1] ^= 0xff;
    assert(maple_avatar_pack_parse(bytes, size, &pack) == MAPLE_AVATAR_PACK_ERROR_CHECKSUM);
    free(bytes);
    return 0;
}
