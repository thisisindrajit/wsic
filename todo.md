## Priority
- [ ] Buy domain wsic.app
- [ ] Add user profile icon in topic page at the bottom in left sidebar
- [ ] Move generator api from render to azure functions to reduce costs
- [ ] Optimize LLMAgent outputs and AI agent architecture to reduce errors (Check [callbacks](https://google.github.io/adk-docs/callbacks/types-of-callbacks/) - post processing outputs to remove \`\`\`json{\`\`\`) and make the generation faster (Check [Parallel agents](https://google.github.io/adk-docs/agents/multi-agents/#parallel-fan-outgather-pattern))
- [ ] Make content more personalised to the type of the topic (Topics can range from movies, book overview, concepts, theorems etc. and we need to personalise the generated content accordingly. For ex: If its a movie, show some youtube clips of the movie, and also maybe a link to the OTT where it is available)
- [ ] Add authentication to API routes so that only authenticated users can access the APIs
- [ ] Change the embedding model to text-embedding-3-large for better similarity search results and write a python script to recreate all existing embeddings. Also test whether we are getting better results.
- [ ] Optimize normal useQuery with convex tanstack query client to reduce re-renders and improve performance
- [ ] Update share to have title and abstract (research_brief maybe) of the topic and make the topic page public so that the link preview is visible
- [ ] Add a new table called topic_generation_requests to store the topic generation requests. When a user requests a topic, first check if it is already in generation, and if yes, just return a notification saying that a request is already in progress (ALL CODE WILL BE WRITTEN IN generator_api)
    - [ ] Add code to create a notification saying that the topic generation request has been queued so that the user has an idea that it is being generated in the background (ALSO MAYBE SHOW A LOADING ICON AT THE TOPBAR WHICH ON CLICKING WILL SHOW ALL GENERATION REQUESTS BY THE USER)
- [ ] Use Upstash redis to rate limit number of generations per user per day and updating suggested topics daily using a convex CRON job (Use groq maybe to get suggested topics)
- [ ] Integrate payments using Polar
    - [ ] Make advanced content PRO and add more connections to other topics and image/video content
- [ ] In quiz prompt, ask the AI to set correct_answer to the corresponding index of answer instead of exact text as it might provide slightly varied text in the correct_answer key
    - [ ] Update the same in reorder prompt too, and handle it in the frontend correctly
- [ ] Show all sources at the end and update prompts in research_brief, research_deep and real_world_impact agents to add relevant citation to the sources
    - [ ] Also add tool to get youtube videos related to the topic and since serper already provides images, run these two first to get data, and then ask the other agents to insert these data wherever required
- [ ] Use Zustand to cache pages data so that it's faster on the client side. Also cache new/trending topics and store it in upstash redis so that it's faster on the first load of the page.
- [ ] Create custom queue in upstash with parallelism for faster output generation (EASY BUT IMPORTANT)

## Todo
- [ ] Allow google bots to index WSIC by adding it in google search console
- [ ] Update sources to be shown in a separate tab
- [ ] Add a check in thumbnail generator where if the selected image is not loading, then reselect another image (This is because some instagram image urls are redirecting to instagram post). Also if the protocol is http, change it to https and try again to see if we are able to load the image.
    - [ ] Also update thumbnail generator prompt to select better pictures that are more abstract than information heavy
- [ ] Support to add LaTeX content for physics and math topics and show syntax highlighted code for tech related stuff
- [ ] Add option to skip quiz and unlock below content. Also add user interaction to set completed status once the user has fully gone through the topic (till flashcards)
    - [ ] This completed data will later be used for spaced repetition algorithm
- [ ] After flashcards, add a box below to show what topics to explore next and take the topics from a mix of trending and similar topics
- [ ] Add notes
    - [ ] Information can be directly added to notes by highlighting text and selecting "Add to note" option
- [ ] Add communities
- [ ] Add new user onboarding and welcome email
- [ ] Add buy premium near profile icon
- [ ] Think if we need to update the topic name using AI instead of using the original topic name provided by user
- [ ] CREATE A NEW SUBSET OF WSIC CALLED WSIC KIDS (kids.wsic.app) where content is personalised towards educational content for kids with a major UI overhaul.

## Future
- [ ] Provide comprehensive AI-generated roadmaps to learn the topic in a structured manner (inspired from roadmap.sh)
- [ ] Knowledge graphs with GraphRAG
- [ ] Always available topic understanding LLM at bottom right
- [ ] Snippets (Reels like feature)
- [ ] Mobile app (Capacitor)