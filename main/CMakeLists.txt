# [INPUT]: Depends on generated asset inventory and the BSP public component.
# [OUTPUT]: Builds the Maple Avatar application and embeds RGB565/RGB565A8 resources.
# [POS]: Main component build boundary; product UI replaces the upstream demo menu.
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
include("${CMAKE_CURRENT_LIST_DIR}/maple_avatar/generated/assets.cmake")

idf_component_register(
    SRCS "main.c"
         "maple_avatar/maple_avatar_app.c"
         "maple_avatar/maple_avatar_state.c"
         "maple_avatar/generated/avatar_generated.c"
    INCLUDE_DIRS "." "maple_avatar"
    EMBED_FILES ${MAPLE_AVATAR_EMBED_FILES}
    REQUIRES bsp
)
