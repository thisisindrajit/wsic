## Priority
- [ ] Optimize LLMAgent outputs and AI agent architecture to reduce number of tokens and make the generation faster
- [ ] Add authentication to API routes so that only authenticated users can access the APIs
- [ ] Add a new table called topic_generation_requests to store the topic generation requests. When a user requests a topic, first check if it is already in generation, and if yes, just return a notification saying that a request is already in progress (ALL CODE WILL BE WRITTEN IN generator_api)
    - [ ] Add code to create a notification saying that the topic generation request has been queued so that the user has an idea that it is being generated in the background (ALSO MAYBE SHOW A LOADING ICON AT THE TOPBAR WHICH ON CLICKING WILL SHOW ALL GENERATION REQUESTS BY THE USER)
- [ ] Use Upstash redis to rate limit number of generations per user per day and updating suggested topics daily using a convex CRON job (Use groq maybe to get suggested topics)
- [ ] Integrate payments using Polar
- [ ] In quiz prompt, ask the AI to set correct_answer to the corresponding index of answer instead of exact text as it might provide slightly varied text in the correct_answer key
    - [ ] Update the same in reorder prompt too, and handle it in the frontend correctly
- [ ] Show all sources at the end and update prompts in research_brief, research_deep and real_world_impact agents to add relevant citation to the sources

## Todo
- [ ] Add option to skip quiz and unlock below content. Also add user interaction to set completed status once the user has fully gone through the topic (till flashcards)
    - [ ] This completed data will later be used for spaced repetition algorithm
- [ ] After flashcards, add a box below to show what topics to explore next and take the topics from a mix of trending and similar topics
- [ ] Add notes
- [ ] Add communities
- [ ] Add new user onboarding and welcome email
- [ ] Add buy premium near profile icon
- [ ] Think if we need to update the topic name using AI instead of using the original topic name provided by user
