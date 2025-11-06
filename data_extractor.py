import json
import html
import argparse
import sys
from bs4 import BeautifulSoup


def process_file(input_file, title, output_file=None):
    """
    Parses an HTML file, extracts embedded JSON data from the <app-root>
    tag, transforms it, and saves it to a new JSON file.
    """

    # --- 1. Determine Output Filename ---
    if output_file:
        output_filename = output_file
        # Ensure it ends with .json
        if not output_filename.endswith('.json'):
            output_filename += '.json'
    else:
        # Create a valid filename from the title
        # Replace spaces with underscores and remove invalid chars
        safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '_')).rstrip()
        output_filename = safe_title.replace(' ', '_') + '.json'

    try:
        # --- 2. Read and Parse HTML ---
        print(f"Opening '{input_file}'...")
        with open(input_file, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f, 'html.parser')

        # --- 3. Find and Extract Data ---
        app_root = soup.find('app-root')
        if not app_root:
            print("Error: Could not find the <app-root> tag in the HTML.", file=sys.stderr)
            return

        app_data_raw = app_root.get('data-app-data')
        if not app_data_raw:
            print("Error: Found <app-root> but it has no 'data-app-data' attribute.", file=sys.stderr)
            return

        # --- 4. Unescape and Load JSON ---
        app_data_unescaped = html.unescape(app_data_raw)

        # The data starts with "{" but is embedded, so we find the first {
        # and the last } to isolate the JSON object.
        json_start = app_data_unescaped.find('{')
        json_end = app_data_unescaped.rfind('}') + 1

        if json_start == -1 or json_end == 0:
            print("Error: Could not find valid JSON object delimiters {} in the data.", file=sys.stderr)
            return

        json_string = app_data_unescaped[json_start:json_end]

        data = json.loads(json_string)

        output_data = {"title": title}

        # --- 5. Type Detection and Transformation ---

        # Check for Flashcards
        if 'flashcards' in data:
            print("Detected 'flashcards' data. Processing...")
            processed_cards = []
            for card in data['flashcards']:
                processed_cards.append({
                    "front": card.get('f'),
                    "back": card.get('b')
                })
            output_data['flashcards'] = processed_cards

        # Check for Quiz
        elif 'quiz' in data:
            print("Detected 'quiz' data. Processing...")
            # Per requirements, we add the quiz data as-is
            output_data['quiz'] = data['quiz']

        # Handle Unexpected Type
        else:
            print("Error: Unexpected data type. No 'flashcards' or 'quiz' key found in the data.", file=sys.stderr)
            return

        # --- 6. Write Output JSON File ---
        with open(output_filename, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)

        print(f"\n Success! Data extracted and saved to '{output_filename}'")

    except FileNotFoundError:
        print(f"Error: Input file '{input_file}' not found.", file=sys.stderr)
    except json.JSONDecodeError:
        print("Error: Failed to decode JSON. The data in the attribute may be corrupt.", file=sys.stderr)
    except Exception as e:
        print(f"An unexpected error occurred: {e}", file=sys.stderr)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Extract embedded JSON data from NotebookLM HTML blob files."
    )

    parser.add_argument(
        "-i", "--input_file",
        help="The path to the input HTML file (e.g., '55fab1b2...')."
    )

    parser.add_argument(
        "-t", "--title",
        required=True,
        help="The title to add to the output JSON file (e.g., 'Microscopy')."
    )

    parser.add_argument(
        "-o", "--output_file",
        help="Optional: The name for the output JSON file. "
             "If not provided, it will be generated from the title."
    )

    args = parser.parse_args()

    process_file(args.input_file, args.title, args.output_file)
