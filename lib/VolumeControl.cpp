#include <endpointvolume.h>
#include <mmdeviceapi.h>
#include <objbase.h>

IAudioEndpointVolume* getAudioDevice() {
  CoInitialize(NULL);

  IMMDeviceEnumerator* mmDeviceEnumerator {nullptr};
  HRESULT result = CoCreateInstance(
    __uuidof(MMDeviceEnumerator),
    NULL,
    CLSCTX_INPROC_SERVER,
    __uuidof(IMMDeviceEnumerator),
    reinterpret_cast<LPVOID*>(&mmDeviceEnumerator)
  );

  if (!SUCCEEDED(result)) {
    return nullptr;
  }

  IMMDevice* defaultAudioDevice {nullptr};
  result = mmDeviceEnumerator->GetDefaultAudioEndpoint(eRender, eConsole, &defaultAudioDevice);
  mmDeviceEnumerator->Release();

  if (!SUCCEEDED(result)) {
    return nullptr;
  }

  IAudioEndpointVolume* audioEndpointVolume {nullptr};
  result = defaultAudioDevice->Activate(
    __uuidof(IAudioEndpointVolume),
    CLSCTX_INPROC_SERVER,
    NULL,
    reinterpret_cast<LPVOID*>(&audioEndpointVolume)
  );
  defaultAudioDevice->Release();

  if (!SUCCEEDED(result)) {
    return nullptr;
  }

  return audioEndpointVolume;
}

bool setVolume(int volume) {
  IAudioEndpointVolume* audioDevice = getAudioDevice();
  if (audioDevice == nullptr) {
    return false;
  }

  float volumeLevel = static_cast<float>(volume) / 100;
  HRESULT result = audioDevice->SetMasterVolumeLevelScalar(volumeLevel, NULL);
  audioDevice->Release();

  return SUCCEEDED(result);
}

bool setMute(bool mute) {
  IAudioEndpointVolume* audioDevice = getAudioDevice();
  if (audioDevice == nullptr) {
    return false;
  }

  HRESULT result = audioDevice->SetMute(mute ? 1 : 0, NULL);
  audioDevice->Release();

  return SUCCEEDED(result);
}
