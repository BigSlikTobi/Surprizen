class StoryboardCreationService
  Result = Struct.new(:success?, :data, :error, keyword_init: true)

  def initialize(journey:)
    @journey = journey
  end

  def call
    last_message = get_last_ai_message
    return Result.new(success?: false, error: "No AI messages found.") unless last_message

    json_data = extract_json_from_content(last_message.content)
    return Result.new(success?: false, error: "Last AI message contains no valid JSON.") unless json_data

    steps_array = json_data.dig('strategy', 'steps')
    return Result.new(success?: false, error: "JSON is missing 'strategy.steps' array.") unless steps_array.is_a?(Array)

    save_steps(steps_array)

    Result.new(success?: true, data: @journey)
  end

  private

  def get_last_ai_message
    @journey.conversation&.messages&.where(role: 'model')&.order(:created_at)&.last
  end

  def extract_json_from_content(text_content)
    # This regex is designed to find a JSON object embedded in a larger string.
    match_data = text_content.match(/\{.*\}/m)
    return nil unless match_data
    JSON.parse(match_data[0])
  rescue JSON::ParserError
    nil
  end

  def save_steps(steps_data)
    # This maps the keys from the AI's JSON to your database column names.
    # This is where you would rename 'type' to 'step_type', for example.
    transformed_attributes = steps_data.map.with_index do |step_hash, index|
      { 
        step_type: step_hash['type'], 
        channel: step_hash['channel'], 
        step_number: index + 1 # Assign step number based on array order
      }
    end

    # Thanks to `accepts_nested_attributes_for`, this single `update!` call
    # creates all the Step records in one database transaction.
    @journey.update!(steps_attributes: transformed_attributes)
  end
end
