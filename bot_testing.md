# Test Script: VisionChatService

This script tests the initial "Vision Bot" by starting a new conversation. It ensures the service can be initialized and can receive its first response from the Gemini API.

### Steps

1.  **Launch the Rails Console:**
    ```shell
    rails c
    ```

2.  **Run the script below in the console:**

    This script will:
    * Create a test `User` and a `Journey`.
    * Instantiate the `VisionChatService` for that journey.
    * Send an initial message to the bot.
    * Print the AI's response or any errors.

    ```ruby
    puts "--- Testing Vision Bot ---"

    # 1. Set up the necessary data
    user = User.find_or_create_by!(email: 'test_vision@example.com') { |u| u.name = 'Vision Tester' }
    journey = user.journeys.create!(title: "New Vision Test")
    puts "Created Journey with ID: #{journey.id}"

    # 2. Instantiate the VisionChatService
    # [cite_start]This service is designed to start the conversation with the Giver [cite: 338]
    service = VisionChatService.new(journey: journey)
    puts "VisionChatService instantiated."

    # 3. Call the service with the first prompt
    prompt = "Hello, I'd like to plan a surprise."
    puts "Sending prompt: '#{prompt}'"
    result = service.call(prompt_text: prompt)

    # 4. Inspect the result
    if result.success?
      puts "\n✅ SUCCESS: Vision Bot responded:"
      puts result.data
    else
      puts "\n❌ ERROR:"
      puts result.error
    end
    ```

# Test Script: StrategyChatService

This script tests the second "Strategy Bot". It first creates a fake conversation history (simulating the output of the Vision Bot) and then calls the `StrategyChatService` to see if it correctly analyzes the history and produces the final JSON output.

### Steps

1.  **Launch the Rails Console:**
    ```shell
    rails c
    ```

2.  **Run the script below in the console:**

    This script will:
    * Create a test `User` and `Journey`.
    * Create a fake conversation history with several messages.
    * Instantiate the `StrategyChatService`.
    * Call the service, asking it to create a strategy.
    * Print the final JSON response or any errors.

    ```ruby
    puts "--- Testing Strategy Bot ---"

    # 1. Set up the necessary data
    user = User.find_or_create_by!(email: 'test_strategy@example.com') { |u| u.name = 'Strategy Tester' }
    journey = user.journeys.create!(title: "New Strategy Test")
    puts "Created Journey with ID: #{journey.id}"

    # 2. Create a fake conversation history for the bot to analyze
    conversation = Conversation.find_or_create_by!(journey: journey, user: user)
    puts "Seeding conversation history for Journey ID: #{journey.id}..."
    conversation.messages.create!([
      {role: 'user', content: 'Hi! I need some gift ideas.'},
      {role: 'model', content: "Of course! To start, who is this surprise for?"},
      {role: 'user', content: "It's for my dad. His birthday is coming up."},
      {role: 'model', content: "Wonderful! What are some of his interests?"},
      {role: 'user', content: 'He loves history, specifically WWII, and enjoys building models.'},
      {role: 'model', content: "That's very helpful! What is your approximate budget?"},
      {role: 'user', content: 'Let\'s keep it around $200.'}
    ])
    puts "History seeded."

    # 3. Instantiate the StrategyChatService
    # [cite_start]This bot's goal is to analyze the vision and create a concrete strategy [cite: 401]
    service = StrategyChatService.new(journey: journey)
    puts "StrategyChatService instantiated."

    # 4. Call the service with a prompt to trigger the final JSON output
    prompt = "Okay, that's enough information. Please generate the strategy based on our conversation."
    puts "Sending prompt: '#{prompt}'"
    result = service.call(prompt_text: prompt)

    # 5. Inspect the result
    # [cite_start]The goal is to receive a final strategy in a structured JSON format[cite: 410].
    if result.success?
      puts "\n✅ SUCCESS: Strategy Bot responded with JSON:"
      puts result.data
    else
      puts "\n❌ ERROR:"
      puts result.error
    end
    ```