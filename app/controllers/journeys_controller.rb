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
    user_message = @journey.conversation.messages.create!(role: 'user', content: params[:message])

    render turbo_stream: [
      turbo_stream.append("chat_log", partial: "messages/message", locals: { message: user_message }),
      turbo_stream.append("chat_log", partial: "messages/_typing_indicator")
    ]

    VisionChatJob.perform_later(@journey)
  end
end