
class VisionChatService
  # We will use a Struct to return a consistent object from this service.
  # It will respond to `success?` and have either `data` or an `error` message.
  Result = Struct.new(:success?, :data, :error, keyword_init: true)

  def initialize(journey:)
    # Initialize the service with a journey object from which we can derive the conversation from the database.
    @journey = journey
    @conversation = find_or_create_conversation
    @client = GEMINI_CLIENT
  end 

  # The main public method for the service.
  def call(prompt_text:, image_attachment: nil)
    
    # 1. Save the user's message to the database.
    save_message(role: 'user', content: prompt_text, image_attachment: image_attachment)

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

  def prepare_payload
    parts = [{text: prompt_text}]
    if image_attachment.present?
        parts << {
            inline_data: {
                mime_type: image_attachment.content_type,
                data: encode_image(image_attachment)
            }
        }
    end

    { contents: [{parts:parts}] }
  end

  def encode_image(attachment)
    # Reads the image file and encodes it in Base64.
    Base64.strict_encode64(attachment.download)
  end

  def generate_content(payload)
    # This method will make the actual call to the Gemini API.
    client.generate_content(payload)
  end

  def handle_response(response)
    text_content = response.dig(0, 'candidates', 0, 'content', 'parts', 0, 'text')

    if text_content
        Result.new(success?: true, data: text_content)
        else
        error_message = response.dig(0, 'promptFeedback', 'blockReason', 'reason') || "No content in response"
        Result.new(success?: false, error: error_message)
        end
  end

  def save_message(role:, content:, image_attachment: nil)
    # This method saves a message to the conversation. Currently only text messages are supported.
    message = conversation.messages.create!(
      role: role,
      content: content
    )
    message
  rescue ActiveRecord::RecordInvalid => e
    Result.new(success?: false, error: "Failed to save message: #{e.message}")
  end

    def build_api_payload
    # This method builds the payload for the Gemini API request.

    system_prompt = "You are a friendly and enthusiastic gift concierge named Surprizen. Your goal is to help the user create a vision for a perfect surprise gift journey. Ask questions one at a time to gather the following details: the occasion, the recipient's name and interests, the desired tone for the surprise, and the giver's budget."
    history = [{role: 'model', parts: [{text: system_prompt}]}]

    #now add all messages from the conversation
    conversation.messages.order(:created_at).each do |message|
        # the API expects "model" for the AI's role and "user" for the user's role
        history << { role: message.role, parts: [{ text: message.content }] }
    end

    { contents: history }
  end

  def handle_response(response)
    # This method handles the response from the Gemini API.
    # Let's debug the response structure first
    puts "Debug - Full response: #{response.inspect}" if Rails.env.development?
    
    # Try different possible paths for the text content
    text_content = response.dig('candidates', 0, 'content', 'parts', 0, 'text') ||
                   response.dig(0, 'candidates', 0, 'content', 'parts', 0, 'text') ||
                   response.dig('response', 'candidates', 0, 'content', 'parts', 0, 'text')

    if text_content
      # Save the assistant's message to the database
      save_message(role: 'model', content: text_content)
      Result.new(success?: true, data: text_content)
    else
      error_message = response.dig('promptFeedback', 'blockReason') || 
                     response.dig(0, 'promptFeedback', 'blockReason', 'reason') || 
                     "No content in response. Response structure: #{response.keys if response.respond_to?(:keys)}"
      Result.new(success?: false, error: error_message)
    end
  end
end