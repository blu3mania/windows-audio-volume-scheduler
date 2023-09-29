cmake_minimum_required(VERSION 3.20)

# set the project name
project(VolumeControl)

# compile with C++ standard 23
set(CMAKE_CXX_STANDARD 23)

# use Unicode chars
add_definitions(-DUNICODE -D_UNICODE)

# add source files
file(GLOB dll_source_files CONFIGURE_DEPENDS lib/*.cpp lib/Exports.def)
file(GLOB test_source_files CONFIGURE_DEPENDS test/*.cpp)

# add output binaries
add_library(VolumeControl SHARED ${dll_source_files})
add_executable(Test ${test_source_files})
target_link_libraries(Test VolumeControl)
