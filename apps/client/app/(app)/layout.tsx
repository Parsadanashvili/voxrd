import NavigationSidebar from "@/components/navigation/NavigationSidebar";
import { ModalProvider } from "@/components/providers/ModalProvider";
import { WebRtcProvider } from "@/components/webrtc/WebRtcProvider";

const AppLayout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <WebRtcProvider>
      <div className="h-full">
        <div className="hidden md:flex h-full w-[55px] z-30 flex-col fixed inset-y-0">
          <NavigationSidebar />
        </div>
        <main className="md:pl-[65px] h-full">{children}</main>
        <ModalProvider />
      </div>
    </WebRtcProvider>
  );
};

export default AppLayout;
