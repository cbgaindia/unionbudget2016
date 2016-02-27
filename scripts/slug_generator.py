import argparse
import re

class SlugGenerator:
    def generate_slug(self, input_text):
        slug = re.sub(r'[^A-Za-z0-9]', '_', input_text).lower() 
        return slug

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Generates slug for input text")
    parser.add_argument("input_text", help="input text")
    args = parser.parse_args()
    obj = SlugGenerator()
    if not args.input_text:
        print("Please pass input text")
    else:
        print(obj.generate_slug(args.input_text))

