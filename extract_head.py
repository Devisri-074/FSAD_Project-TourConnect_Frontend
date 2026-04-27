import sys

def extract_head(file_path):
    with open(file_path, 'r', encoding='utf-16le') as f: # PowerShell redirection was utf-16le
        lines = f.readlines()
    
    result = []
    in_conflict = False
    keep = True
    
    for line in lines:
        if line.startswith('<<<<<<< HEAD'):
            in_conflict = True
            keep = True
        elif line.startswith('======='):
            keep = False
        elif line.startswith('>>>>>>>'):
            in_conflict = False
            keep = True
        else:
            if keep:
                result.append(line)
                
    return "".join(result)

if __name__ == "__main__":
    content = extract_head('blob_content.txt')
    with open('AdminDashboard_Restored.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
