import TopBar from "@/components/TopBar";
import SuggestedTopics from "@/components/SuggestedTopics";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";

const Home = () => {
  const gradientTextClass = "text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-indigo-400";

  return (
    <>
      <TopBar />
      {/* Search box */}
      <div className="flex flex-col items-center justify-center flex-1 py-12 min-h-[calc(100vh-6rem)]">
        <div className="flex flex-col pb-16 sm:max-w-[90%]">
          <div className="text-4xl/normal md:text-5xl/normal xl:text-6xl/normal font-light">
            <span className={gradientTextClass}>W</span>hy <span className={gradientTextClass}>S</span>hould <span className={gradientTextClass}>I</span> <span className={gradientTextClass}>C</span>are about
          </div>
          <div className="flex flex-col md:flex-row items-stretch gap-4">
            <Input
              type="text"
              placeholder="type in any topic..."
              autoFocus
              className="h-auto border-x-0 border-t-0 text-4xl/normal md:text-5xl/normal xl:text-6xl/normal font-light p-0 focus-visible:ring-none focus-visible:ring-[0px] focus-visible:border-indigo-500 focus-visible:text-indigo-500 transition-all"
              maxLength={256}
            />
            <div className="bg-indigo-500 flex items-center justify-center self-end md:self-auto h-14 md:h-auto mr-0 w-14 md:w-20 xl:w-26 text-background hover:bg-indigo-500/90 transition-all cursor-pointer border border-indigo-500">
              <ArrowRight className="h-6 w-6 md:h-8 md:w-8 xl:h-10 xl:w-10" />
            </div>
          </div>
          <div className="mt-4 md:mt-10 text-lg font-light flex flex-col gap-3">
            <div>Suggested topics</div>
            <SuggestedTopics />
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