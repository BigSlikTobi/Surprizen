class RenameOccationToOccasionInJourneys < ActiveRecord::Migration[8.0]
  def change
    rename_column :journeys, :occation, :occasion
  end
end
