
class StrategyChatService
  # It will respond to `success?` and have either `data` or an `error` message.
  Result = Struct.new(:success?, :data, :error, keyword_init: true)

  def initialize(journey:)
    # Initialize the service with a journey object from which we can derive the conversation from the database.
    @journey = journey
    @conversation = find_or_create_conversation
    @client = GEMINI_CLIENT
  end 

  # The main public method for the service.
  def call(prompt_text:)
    
    # 1. Save the user's message to the database.
    save_message(role: 'user', content: prompt_text)

    # 2. Build the payload for the entire conversation history
    payload = build_api_payload

    # 3. Send the request to the Gemini API
    response = generate_content(payload)

    # 4. Handle the response and save the assistant's message
    handle_response(response)
  rescue Faraday::Error => e
    Result.new(success?: false, error: "Network error: #{e.message}")
    end

  private

  attr_reader :journey, :conversation, :client

  def find_or_create_conversation
    # Logic to find or create a conversation
    journey.conversation || journey.create_conversation!(user: journey.user)
  end

  def generate_content(payload)
    # This method will make the actual call to the Gemini API.
    client.generate_content(payload)
  end

#   def handle_response(response)
#     text_content = response.dig(0, 'candidates', 0, 'content', 'parts', 0, 'text')

#     if text_content
#         Result.new(success?: true, data: text_content)
#         else
#         error_message = response.dig(0, 'promptFeedback', 'blockReason', 'reason') || "No content in response"
#         Result.new(success?: false, error: error_message)
#         end
#   end

  def save_message(role:, content:)
    conversation.messages.create!(
      role: role,
      content: content
    )
  rescue ActiveRecord::RecordInvalid => e
    Result.new(success?: false, error: "Failed to save message: #{e.message}")
  end

    def build_api_payload
    # This method builds the payload for the Gemini API request.

    system_prompt = """
    You are a creative surprise strategist. 
    You have been provided with a conversation transcript where a user has defined their vision for a gift. 
    Your task is to analyze this vision and collaborate with the user to create a concrete strategy. 
    Your goal is to define: 
    1) The number of puzzle steps (between 3 and 5), 
    2) The type of puzzles for each step, 
    3) The distribution channels (e.g., email, SMS), and 4) A shortlist of two specific gift ideas that match the user's vision and budget. 
    When you have gathered all this information, present the final strategy in a structured JSON format.
    
    the JSON format should look like this:
    {
        'strategy': {
            'step_count': 4,
            'steps': [
                { 'type': 'riddle', 'channel': 'email' },
                { 'type': 'image_puzzle', 'channel': 'email' },
                { 'type': 'quiz', 'channel': 'sms' },
                { 'type': 'final_reveal', 'channel': 'web' }
            ],
            'gift_shortlist': [
                { 'name': 'Weekend Getaway', 'description': 'A trip to a seaside art retreat.' },
                { 'name': 'Painting Class', 'description': 'A local gourmet pastry masterclass.' }
            ]
        }
    }
    """
    history = [{role: 'model', parts: [{text: system_prompt}]}]

    #now add all messages from the conversation
    conversation.messages.order(:created_at).each do |message|
        # the API expects "model" for the AI's role and "user" for the user's role
        history << { role: message.role, parts: [{ text: message.content }] }
    end

    { contents: history }
  end

  def handle_response(response)
    # Extract the text content from the response
    text_content = response.dig(0, 'candidates', 0, 'content', 'parts', 0, 'text') ||
                   response.dig('candidates', 0, 'content', 'parts', 0, 'text')

    if text_content
      # Save the assistant's message to the database
      save_message(role: 'model', content: text_content)
      Result.new(success?: true, data: text_content)
    else
      error_message = response.dig(0, 'promptFeedback', 'blockReason', 'reason') || "No content in response"
      Result.new(success?: false, error: error_message)
    end
  end
end