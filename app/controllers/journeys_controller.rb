require 'ostruct'

class JourneysController < ApplicationController
  def new
    # For now, we'll find or create a test user.
    # In a real app, this would be your `current_user` after they log in.
    user = User.find_or_create_by!(email: 'giver@example.com') { |u| u.name = 'Test Giver' }

    # Create a new Journey for this user
    @journey = user.journeys.create!

    # Create the associated conversation and seed it with the system prompt
    # This uses the find_or_create_by! pattern.
    conversation = Conversation.find_or_create_by!(journey: @journey, user: @journey.user)

    # Store the journey's ID in the session to track the conversation
    session[:journey_id] = @journey.id
  end

  def show
    # This line finds the Journey record from the database using the 'id'
    # from the URL (e.g., the '5' in /journeys/5).
    @journey = Journey.find(params[:id])

    # The @journey instance variable is now available to the view.
  end

  def chat
    @journey = Journey.find(session[:journey_id])
    service = VisionChatService.new(journey: @journey)
    result = service.call(prompt_text: params[:message])

    if result.success?
      user_message = @journey.conversation.messages.where(role: 'user').last
      ai_response = @journey.conversation.messages.where(role: 'model').last
    
      # We will build an array of streams to render.
      streams = []
    
      # Always append the chat messages.
      streams << turbo_stream.append("chat_log", partial: "messages/message", locals: { message: user_message })
      streams << turbo_stream.append("chat_log", partial: "messages/message", locals: { message: ai_response })
    
      # Conditionally add the profile card update if journey was updated.
      if result.journey_updated?
        # Reload the journey to get the latest data
        @journey.reload
        streams << turbo_stream.update("profile_card", partial: "journeys/profile_card", locals: { journey: @journey })
      end
    
      respond_to do |format|
        format.turbo_stream { render turbo_stream: streams }
      end
    else
      # The error handling remains the same.
      error_message = OpenStruct.new(role: 'Error', content: result.error)
      respond_to do |format|
        format.turbo_stream do
          render turbo_stream: turbo_stream.append("chat_log", partial: "messages/message", locals: { message: error_message })
        end
      end
    end
  end
end