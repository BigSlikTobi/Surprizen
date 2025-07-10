class StoryboardCreationService 
    Result = Struct.new(:success?, :data, :error, keyword_init: true)

    def initialize(journey:)
        # Initialize the service with a journey object from which we can derive the conversation from the database.
        @journey = journey
    end

    # get the output from the StrategicChatService and extract the json data and saving it to the steps table in the database.
    def call
        # 1. Find the last message in the conversation
        last_message = get_last_ai_message
        unless last_message
            return Result.new(success?: false, error: "No AI message found in the conversation")
        end

        # 2. Extract the JSON string from the last message
        json_data = extract_json_from_content(last_message.content)
        unless json_data
            return Result.new(success?: false, error: "No JSON data found in the last message")
        end

        #3. Parse the JSON and find the nested array of steps
        steps_array = json_data.dig('strategy', 'steps')
        unless steps_array.is_a?(Array)
            return Result.new(success?: false, error: "json is missing the 'steps' array")
        end 

        #4. create the Step records in the database
        save_steps(steps_array)
        Result.new(success?:true, data: journey.reload.steps)
    end

    private
    attr_reader :journey

    def get_last_ai_message
        # This method retrieves the last AI message from the conversation.
        journey.conversation.messages.where(role: 'model')&.order(:created_at)&.last
    end

    def extract_json_from_content (text_content)
        # The json might be surounded by other text so we will need regex to extract it.
        match_data = text_content.match(/({.*})/m)
        return nil unless match_data

        json_string = match_data[0] # Extract the matched JSON string

        JSON.parse(json_string)
    rescue JSON::ParserError
        nil # If parsing fails, return nil
    end

    def save_steps (steps_data)
        #THe 'accepts_nested_attributes_for :steps' in the Journey model allows us to create steps directly through the journey.
        journey.update!(steps_attributes: steps_data)
    rescue ActiveRecord::RecordInvalid => e
        # If saving the steps fails, return an error result.
        raise e
    end
end

