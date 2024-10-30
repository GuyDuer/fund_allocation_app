import csv
import os
import chardet
import argparse

def process_csv_to_txt(csv_file_path, output_directory):
    # Create the output directory if it doesn't exist
    os.makedirs(output_directory, exist_ok=True)
    
    # Extract the filename without extension
    base_name = os.path.splitext(os.path.basename(csv_file_path))[0]
    output_file_path = os.path.join(output_directory, f"{base_name}_processed.txt")

    # Try different encodings
    encodings = ['utf-8', 'iso-8859-1', 'windows-1252']
    
    for encoding in encodings:
        try:
            with open(csv_file_path, 'r', newline='', encoding=encoding) as csv_file, \
                 open(output_file_path, 'w', encoding='utf-8') as txt_file:
                csv_reader = csv.reader(csv_file)
                
                # Skip header if it exists
                next(csv_reader, None)
                
                for row in csv_reader:
                    if len(row) >= 2:
                        subject = row[0].strip()
                        description = row[1].strip()
                        
                        txt_file.write(f"Subject:\n{subject}\n\n")
                        txt_file.write(f"Description:\n{description}\n\n")
            
            print(f"Processed file saved as: {output_file_path}")
            break  # If successful, exit the loop
        except UnicodeDecodeError:
            continue  # If unsuccessful, try the next encoding
    else:
        print(f"Unable to decode the CSV file. Tried encodings: {', '.join(encodings)}")

def main():
    parser = argparse.ArgumentParser(description="Process CSV files to TXT format.")
    parser.add_argument("-d", "--directory", help="Start directory for browsing")
    args = parser.parse_args()

    start_dir = args.directory if args.directory else os.getcwd()

    while True:
        print(f"\nCurrent directory: {start_dir}")
        print("Contents:")
        for item in os.listdir(start_dir):
            print(f"- {item}")
        
        choice = input("\nEnter a subdirectory name, '..' to go up, or the CSV file name (or 'q' to quit): ").strip()
        
        if choice.lower() == 'q':
            print("Exiting the program.")
            return
        
        if choice == '..':
            start_dir = os.path.dirname(start_dir)
        else:
            new_path = os.path.join(start_dir, choice)
            if os.path.isdir(new_path):
                start_dir = new_path
            elif os.path.isfile(new_path) and new_path.lower().endswith('.csv'):
                csv_file_path = new_path
                break
            else:
                print("Invalid choice. Please try again.")

    output_directory = os.path.join(start_dir, 'output')
    process_csv_to_txt(csv_file_path, output_directory)

if __name__ == "__main__":
    main()

if __name__ == "__main__":
    main()
