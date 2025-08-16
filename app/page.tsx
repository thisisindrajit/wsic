import TopBar from "@/components/TopBar";
import SuggestedTopics from "@/components/SuggestedTopics";
import Block from "@/components/Block";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";

const Home = () => {
  const gradientTextClass = "text-transparent bg-clip-text bg-gradient-to-br from-teal-600 to-teal-400";

  return (
    <>
      <TopBar />
      {/* Search box */}
      <div className="flex flex-col items-center justify-center flex-1 py-12 min-h-[calc(100vh-6rem)]">
        <div className="flex flex-col pb-8 sm:max-w-[90%]">
          <div className="text-4xl/normal md:text-5xl/normal xl:text-6xl/normal font-light">
            <span className={gradientTextClass}>W</span>hy <span className={gradientTextClass}>S</span>hould <span className={gradientTextClass}>I</span> <span className={gradientTextClass}>C</span>are about
          </div>
          <div className="flex flex-col md:flex-row items-stretch gap-4">
            <Input
              type="text"
              placeholder="type in any topic..."
              className="h-auto border-x-0 border-t-0 border-foreground text-4xl/normal md:text-5xl/normal xl:text-6xl/normal font-light p-0 focus-visible:ring-none focus-visible:ring-[0px] focus-visible:border-teal-500 focus-visible:text-teal-500 transition-all"
              maxLength={256}
            />
            <div className="bg-teal-500 flex items-center justify-center self-end md:self-auto h-14 md:h-auto mr-0 w-14 md:w-20 xl:w-26 text-background hover:bg-teal-500/90 transition-all cursor-pointer border border-teal-500">
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
      <div className="flex flex-col gap-4">
        <div className="text-2xl/normal font-medium">
          <span className="font-light uppercase">Trending</span> Blocks
        </div>
        {/* Blocks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 justify-items-center">
          <Block
            imageUrl="https://blogs.microsoft.com/wp-content/uploads/sites/5/2023/11/GettyImages-1165687569-scaled.jpg"
            title="Elections"
            description="Understanding democratic processes, voting systems, and their impact on society."
            likes={1240}
            shares={340}
          />
          <Block
            imageUrl="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Eddy_currents_due_to_magnet.svg/960px-Eddy_currents_due_to_magnet.svg.png"
            title="Eddy Currents"
            description="Exploring electromagnetic induction and its applications in modern technology."
            likes={890}
            shares={180}
          />
          <Block
            imageUrl="https://media.istockphoto.com/id/2157860285/photo/a-conceptual-image-of-climate-change.jpg?s=612x612&w=0&k=20&c=kicaeQNTK1v1gWZF2yX7Lk-xnW9bFrwhCeIiJk8eKrI="
            title="Climate Change"
            description="Examining global warming effects and sustainable solutions for our planet."
            likes={2340}
            shares={650}
          />
          <Block
            imageUrl="https://media.istockphoto.com/id/1387900612/photo/automation-data-analytic-with-robot-and-digital-visualization-for-big-data-scientist.jpg?s=612x612&w=0&k=20&c=50maOJU6CpVC55mYnUqtff2aiaJZ7KlmMn4jNhWD_eo="
            title="Artificial Intelligence"
            description="The future of machine learning and its transformative impact on industries."
            likes={1890}
            shares={420}
          />
          <Block
            imageUrl="https://media.istockphoto.com/id/182062885/photo/space-station-in-earth-orbit.jpg?s=612x612&w=0&k=20&c=F_P2YJ3QDbSW2n6dWkh6JNYeQGI1-2q-wOBk9-sw_Xo="
            title="Space Exploration In Cosmos"
            description="Discovering the cosmos and humanity's journey beyond Earth's boundaries."
            likes={1560}
            shares={380}
          />
        </div>
      </div>
    </>
  );
};

export default Home;