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
    match_data = text_content.match(/\{.*\}/m)
    return nil unless match_data
    JSON.parse(match_data[0])
  rescue JSON::ParserError
    nil
  end

  def save_steps(steps_data)
    transformed_attributes = steps_data.map.with_index do |step_hash, index|
      {
        step_type: step_hash['type'],
        channel: step_hash['channel'],
        step_number: index + 1
      }
    end

    @journey.update!(steps_attributes: transformed_attributes)
  end
end
