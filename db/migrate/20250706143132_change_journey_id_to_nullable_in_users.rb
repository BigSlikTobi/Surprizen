class ChangeJourneyIdToNullableInUsers < ActiveRecord::Migration[8.0]
  def change
    change_column_null :users, :journey_id, true
  end
end
