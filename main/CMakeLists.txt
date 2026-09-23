# [INPUT]: Depends on the BSP plus runtime avatar-pack parser and partition Adapter.
# [OUTPUT]: Builds the generic Maple Avatar player without compiling one user's images into the app.
# [POS]: Main component build boundary; product UI replaces the upstream demo menu.
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
idf_component_register(
    SRCS "main.c"
         "maple_avatar/maple_avatar_app.c"
         "maple_avatar/maple_avatar_assets.c"
         "maple_avatar/maple_avatar_pack_format.c"
         "maple_avatar/maple_avatar_state.c"
    INCLUDE_DIRS "." "maple_avatar"
    REQUIRES bsp esp_partition
)
