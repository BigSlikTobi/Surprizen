class VisionChatJob < ApplicationJob
  queue_as :default

  def perform(journey)
    # The service needs the last user message to maintain context
    last_user_message = journey.conversation.messages.where(role: 'user').order(:created_at).last
    return unless last_user_message

    service = VisionChatService.new(journey: journey)
    result = service.call(prompt_text: last_user_message.content)

    if result.success?
      ai_response = journey.conversation.messages.where(role: 'model').last
      # This broadcast replaces the typing indicator with the final message
      ai_response.broadcast_replace_to(
        journey,
        target: "typing_indicator",
        partial: "messages/message",
        locals: { message: ai_response }
      )
    end
  end
end
