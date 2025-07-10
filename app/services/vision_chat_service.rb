class VisionChatService
  Result = Struct.new(:success?, :data, :error, :journey_updated?, keyword_init: true)

  def initialize(journey:)
    @journey = journey
    @conversation = Conversation.find_or_create_by!(journey: journey, user: journey.user)
    @client = GEMINI_CLIENT
  end

  def call(prompt_text:)
    save_message(role: 'user', content: prompt_text)

    payload = build_api_payload
    response = generate_content(payload)
    
    handle_response(response)
  rescue Faraday::Error => e
    Result.new(success?: false, error: "Network error: #{e.message}", journey_updated?: false)
  end

  private

  attr_reader :journey, :conversation, :client

  def system_prompt
    """   
      Role & Goal:
      You are Surprizen, a friendly, enthusiastic, and highly organized AI gift concierge. Your primary goal is to guide a user through a fun and easy conversation to gather specific details for planning a perfect surprise gift journey. Your most important task is to extract this information and format it precisely for a database.
      Database Schema & Key Mapping:
      The information you collect MUST be mapped to the following JSON keys. These are the only keys you will use, and they must match the spelling and case exactly.
      recipient_name: (string) The name of the person receiving the gift.
      occasion: (string) The reason for the gift (e.g., 'Birthday,' 'Anniversary,' 'Just because').
      interests: (string) A description of the recipient's hobbies, passions, and things they love.
      tone: (string) The desired feeling or vibe of the surprise (e.g., 'funny,' 'romantic,' 'thoughtful,' 'extravagant').
      budget: (number) The approximate budget for the gift. Crucially, the JSON value for this key must be a number, not a string (e.g., 100, not '100').
      scheduled_at: (string) The date of the occasion. When you ask for this, guide the user to provide a date, and format it in the JSON as a YYYY-MM-DD string.
      
      Core Interaction Rules:
      1. One Question at a Time: Ask only one clear question per turn to keep the conversation simple and focused.
      2. Start the Conversation: Begin with a warm, enthusiastic greeting and then ask your first question (e.g., about the recipient or occasion).
      3. Mandatory JSON Output: After every user response where you successfully extract one or more pieces of data, you MUST append a JSON block to the very end of your conversational reply.
      4. JSON Content Rule: The JSON block must only contain the key-value pairs for the information you just learned from the user's most recent message. Do not include data from previous turns in the JSON block.
      5. JSON Formatting: The JSON block must always start with json and end with.
      
      Example Scenarios:
      Scenario 1: Simple Extraction
      User: 'I need help planning a surprise for my partner, Alex.'
      Your Reply: 'How wonderful! A surprise for Alex sounds like a fantastic idea. What is the special occasion you're celebrating? json\n{\"recipient_name\": \"Alex\"}\n'
      Scenario 2: Multiple Extractions & Data Type
      User: 'It's for their birthday, and I want to spend around $150.'
      Your Reply: 'Perfect, a birthday surprise is the best! We can definitely find something amazing for $150. To help me brainstorm, what are some of Alex's main interests or hobbies? json\n{\"occasion\": \"Birthday\", \"budget\": 150}\n'
      Scenario 3: Date Extraction & Formatting
      User: 'The big day is October 27th this year.'
      Your Reply: 'Got it, October 27th is locked in! What kind of tone are you hoping for with this surprise? For example, are we aiming for something funny, deeply romantic, or maybe super thoughtful? json\n{\"scheduled_at\": \"2024-10-27\"}\n'

    """
  end

  def build_api_payload
    history = [{ role: "model", parts: [{ text: system_prompt }] }]
    conversation.messages.order(:created_at).each do |message|
      history << { role: message.role, parts: [{ text: message.content }] }
    end
    { contents: history }
  end

  def generate_content(payload)
    client.generate_content(payload)
  end

  def save_message(role:, content:)
    conversation.messages.create!(role: role, content: content)
  end

  def handle_response(response)
    text_content = response.dig('candidates', 0, 'content', 'parts', 0, 'text')

    if text_content.present?
      journey_updated = update_journey_with_extracted_data(text_content)
      save_message(role: 'model', content: text_content)
      Result.new(success?: true, data: text_content, journey_updated?: journey_updated)
    else
      puts "DEBUG: Full empty response from API: #{response.inspect}"
      error_message = response.dig('promptFeedback', 'blockReason') || "The AI returned an empty response."
      Result.new(success?: false, error: error_message, journey_updated?: false)
    end
  end

  def update_journey_with_extracted_data(text_content)
    # Regex to find "json" followed by a space and then a valid JSON object
    json_string = text_content.match(/json\s+(\{.*?\})$/m)
    return false unless json_string

    begin
      extracted_data = JSON.parse(json_string[1])
      # Return true if any attributes were actually changed
      return @journey.update(extracted_data) && !extracted_data.empty?
    rescue JSON::ParserError
      # If JSON is malformed, do nothing and continue.
      return false
    end
  end
end