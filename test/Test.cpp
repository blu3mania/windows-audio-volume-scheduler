#include <windows.h>

#include <iostream>
#include <sstream>
#include <string>

extern bool setVolume(int volume);
extern bool setMute(bool mute);

int main(int argc, char** argv) {
  const std::string& commandArg = (argc >= 3 ? std::string(argv[1]) : std::string());
  if (argc < 3 || !(commandArg == "volume" || commandArg == "mute")) {
    std::cout << "Usage: " << argv[0] << " command param" << std::endl;
    std::cout << std::endl;
    std::cout << "Supported commands:" << std::endl;
    std::cout << "  volume: param is volume (integer, between 0 and 100)" << std::endl;
    std::cout << "  mute: param is mute state (boolean, either 'true' or 'false')" << std::endl;
    return -1;
  }

  if (commandArg == "volume") {
    setVolume(std::stoi(argv[2]));
  } else {
    bool mute = false;
    std::istringstream(argv[2]) >> std::boolalpha >> mute;
    setMute(mute);
  }

  return 0;
}