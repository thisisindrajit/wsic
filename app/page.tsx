import TopBar from "@/components/TopBar";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";

const Home = () => {
  return (
    <>

      <TopBar />
      {/* Search box */}
      <div className="flex flex-col items-center justify-center flex-1 py-12 min-h-[calc(100vh-6rem)]">
        <div className="flex flex-col pb-24 mx-2">
          <div className="text-4xl/normal md:text-5xl/normal xl:text-6xl/normal font-light">
            Why Should Anyone Care About
          </div>
          <div className="flex flex-col md:flex-row items-stretch gap-4">
            <Input
              type="text"
              placeholder="type in any topic"
              className="h-auto border-x-0 border-t-0 border-foreground text-4xl/normal md:text-5xl/normal xl:text-6xl/normal font-light p-0 focus-visible:ring-none focus-visible:ring-[0px] focus-visible:border-cyan-500 focus-visible:text-cyan-500 transition-all"
              maxLength={256}
            />
            <div className="bg-cyan-500/10 flex items-center justify-center self-end md:self-auto h-16 md:h-auto mr-0 w-16 md:w-20 xl:w-24 text-cyan-500 hover:bg-cyan-500 hover:text-background transition-all cursor-pointer">
              <ArrowRight className="h-6 w-6 md:h-7 md:w-7 xl:h-8 xl:w-8" />
            </div>
          </div>
        </div>
      </div>
      {/* Trending Blocks */}
      <div>
        <div className="text-2xl/normal font-medium">
          <span className="font-light uppercase">Trending</span> Blocks
        </div>
      </div>
    </>
  );
};

export default Home;